/**
 * @jest-environment jsdom
 */ //

import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import mockStore from "../__mocks__/store"
// import { bills } from "../fixtures/bills"

import router from "../app/Router.js";
import Bills from '../containers/Bills.js'

jest.mock("../app/store", () => mockStore)


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.className).toBe("active-icon")

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    // ////////////////////TEST UNITAIRE /////////////////////

    describe('When Iclick on the eye icon', () => {
      test('It should render a modal', () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({pathname})
        }
        document.body.innerHTML = BillsUI({data: bills})
        const bills2 = new Bills({
          document,onNavigate,localStorage: window.localStorage
        });
        const handleClickIconEye = jest.fn((icon) => bills2.handleClickIconEye(icon))
        const modaleFile = document.getElementById('modaleFile')
        const iconEye = screen.getAllByTestId("icon-eye");
        $.fn.modal = jest.fn(() => modaleFile.classList.add("show"))
        iconEye.forEach(icon => {
          icon.addEventListener("click", handleClickIconEye(icon))
          userEvent.click(icon)
          expect(modaleFile).toHaveClass('show')
        })
      })
    })

    describe('When I click on "Nouvelle note de frais"', () => {
      test('It should render the New Bill Creation, form' , () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({pathname})
        }
        const bills = new Bills({
          document,onNavigate,localStorage: window.localStorage
        });
        const handleClickNewBil = jest.fn(() => bills.handleClickNewBill())
        const addNewBill = screen.getByTestId("btn-new-bill")
        addNewBill.addEventListener("click", handleClickNewBil)
        userEvent.click(addNewBill)
        expect(handleClickNewBil).toHaveBeenCalled()
        expect(screen.queryByText('Envoyer une note de frais')).toBeTruthy()
      })
    })


    /////////////////////////// TEST GET /////////////////////////////
    describe('When i navigate on bills page', () => {
      test('fetches bills from mock API GET ', async () => {
        Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({pathname})
      }

      const mockBills = new Bills({
        document,
        onNavigate,
        store:mockStore,
        localStorage: window.localStorage
      })

      const bills = await mockBills.getBills();
      expect(bills.length!=0).toBeTruthy();
    })

    describe('When an error occurs on API', () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")

        window.localStorage.setItem('user' , JSON.stringify({
          type:'Employee',
          email:'a@a'
        }))

        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      test("fetches bills from an API and fails with 404 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }})
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
  
      test("fetches messages from an API and fails with 500 message error", async () => {
  
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})
  
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
    })
  })
})
